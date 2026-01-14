import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 计算48小时前的时间
    const fortyEightHoursAgo = new Date();
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

    // 查找所有有紧急联系人的用户
    const { data: contacts, error: contactsError } = await supabase
      .from('emergency_contacts')
      .select(`
        id,
        name,
        email,
        user_id,
        users!inner (
          id,
          device_id
        )
      `);

    if (contactsError) {
      throw new Error(`查询紧急联系人失败: ${contactsError.message}`);
    }

    const results = [];

    for (const contact of contacts || []) {
      // 获取该用户最近的签到记录
      const { data: lastCheckin, error: checkinError } = await supabase
        .from('checkins')
        .select('checked_in_at')
        .eq('user_id', contact.user_id)
        .order('checked_in_at', { ascending: false })
        .limit(1)
        .single();

      if (checkinError && checkinError.code !== 'PGRST116') {
        // PGRST116 是"没有找到记录"的错误码，这种情况也需要发送通知
        console.error(`查询签到记录失败: ${checkinError.message}`);
        continue;
      }

      const lastCheckinTime = lastCheckin?.checked_in_at
        ? new Date(lastCheckin.checked_in_at)
        : null;

      // 如果从未签到或者超过48小时未签到
      const isOverdue = !lastCheckinTime || lastCheckinTime < fortyEightHoursAgo;

      if (!isOverdue) {
        continue;
      }

      // 计算这次超时的截止时间点（用于防止重复发送）
      const deadline = lastCheckinTime
        ? new Date(lastCheckinTime.getTime() + 48 * 60 * 60 * 1000)
        : new Date(0); // 从未签到的情况

      // 检查是否已经发送过通知
      const { data: existingNotification } = await supabase
        .from('notifications_sent')
        .select('id')
        .eq('user_id', contact.user_id)
        .eq('checkin_deadline', deadline.toISOString())
        .single();

      if (existingNotification) {
        // 已经发送过通知，跳过
        continue;
      }

      // 发送邮件
      if (resendApiKey) {
        try {
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'onboarding@resend.dev',
              to: contact.email,
              subject: '【死了么】紧急通知：您的联系人已超过48小时未签到',
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h1 style="color: #f97316;">紧急通知</h1>
                  <p>尊敬的 ${contact.name}：</p>
                  <p>您被设置为紧急联系人的用户已经<strong>超过48小时</strong>未在"死了么"应用中签到。</p>
                  <p>最后签到时间：${lastCheckinTime ? lastCheckinTime.toLocaleString('zh-CN') : '从未签到'}</p>
                  <p>建议您尽快联系确认对方是否安全。</p>
                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                  <p style="color: #6b7280; font-size: 12px;">此邮件由"死了么"应用自动发送</p>
                </div>
              `,
            }),
          });

          if (!emailResponse.ok) {
            const errorText = await emailResponse.text();
            throw new Error(`邮件发送失败: ${errorText}`);
          }

          // 记录已发送的通知
          await supabase.from('notifications_sent').insert({
            user_id: contact.user_id,
            contact_id: contact.id,
            checkin_deadline: deadline.toISOString(),
          });

          results.push({
            success: true,
            contact: contact.name,
            email: contact.email,
            lastCheckin: lastCheckinTime?.toISOString() || 'never',
          });
        } catch (emailError) {
          results.push({
            success: false,
            contact: contact.name,
            error: emailError.message,
          });
        }
      } else {
        results.push({
          success: false,
          contact: contact.name,
          error: 'RESEND_API_KEY 未配置',
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: '检查完成',
        checked: contacts?.length || 0,
        notified: results.filter(r => r.success).length,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
