
package vn.edu.iuh.fit.ott_education_be.service.impl;


import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.edu.iuh.fit.ott_education_be.service.EmailService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j(topic = "EMAIL-SERVICE")
public class EmailServiceImpl implements EmailService {
    private final JavaMailSender javaMailSender;

    @Value("${spring.mail.reset-code-expiry-minutes}")
    private int resetCodeExpiryMinutes;

    private String appName = "OTT Education";

    @Override
    public void sendPasswordResetEmail(String email, String code) {
        String subject = "Đặt lại mật khẩu của bạn";
        String content = buildEmailContent(email, code);

        try{
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            setEmailContent(message, helper, subject, content, email);
            javaMailSender.send(message);
            log.info("Email đặt lại mật khẩu đã được gửi đến: {}", email);
        }catch (MessagingException e){
            log.error("Lỗi khi tạo email: {}", e.getMessage());
            throw new RuntimeException("Không thể tạo email", e);
        }
    }

    @Override
    public void sendVerificationEmail(String email, String code) {
        String subject = "Xác thực email của bạn";
        String content = buildEmailContentForVerificationEmail(email, code);

        try{
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            setEmailContent(message, helper, subject, content, email);
            javaMailSender.send(message);
            log.info("Email xác thực đã được gửi đến: {}", email);
        }catch (MessagingException e){
            log.error("Lỗi khi tạo email: {}", e.getMessage());
            throw new RuntimeException("Không thể tạo email", e);
        }
    }


    private void setEmailContent(MimeMessage message, MimeMessageHelper helper, String subject, String content, String email) throws MessagingException {
        helper.setTo(email);
        helper.setSubject(subject);
        helper.setText(content, true);
    }

    /**
     * Xây dựng nội dung HTML cho email đặt lại mật khẩu.
     *
     * @param email địa chỉ email người nhận
     * @param code  mã đặt lại mật khẩu
     * @return nội dung HTML của email
     */
    private String buildEmailContent(String email, String code) {
        return "<!DOCTYPE html>" +
                "<html><head><style>" +
                "body { font-family: Arial, sans-serif; color: #333; }" +
                ".container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }" +
                ".header { text-align: center; }" +
                ".code { font-size: 24px; font-weight: bold; color: #007bff; text-align: center; margin: 20px 0; }" +
                ".footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }" +
                "</style></head>" +
                "<body>" +
                "<div class='container'>" +
                "<div class='header'>" +
                "<h2>Đặt lại mật khẩu " + appName + "</h2>" +
                "</div>" +
                "<p>Kính chào quý người dùng,</p>" +
                "<p>Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng sử dụng mã sau để tiếp tục:</p>" +
                "<div class='code'>" + code + "</div>" +
                "<p>Mã này sẽ hết hạn sau " + resetCodeExpiryMinutes + " phút.</p>" +
                "<p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này hoặc liên hệ bộ phận hỗ trợ.</p>" +
                "<div class='footer'>" +
                "<p>&copy; " + LocalDateTime.now().getYear() + " " + appName + ". Bảo lưu mọi quyền.</p>" +
                "</div>" +
                "</div>" +
                "</body></html>";
    }

   /**
     * Xây dựng nội dung HTML cho email xác thực.
     *
     * @param email địa chỉ email người nhận
     * @param code  mã xác thực
     * @return nội dung HTML của email
     */
    private String buildEmailContentForVerificationEmail(String email, String code) {
        return "<!DOCTYPE html>" +
               "<html><head><style>" +
               "body { font-family: Arial, sans-serif; color: #333; }" +
               ".container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }" +
               ".header { text-align: center; }" +
               ".code { font-size: 24px; font-weight: bold; color: #007bff; text-align: center; margin: 20px 0; }" +
               ".footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }" +
               "</style></head>" +
               "<body>" +
               "<div class='container'>" +
               "<div class='header'>" +
               "<h2>Chào mừng đến với " + appName + "</h2>" +
               "</div>" +
               "<p>Kính chào quý người dùng,</p>" +
               "<p>Cảm ơn bạn đã đăng ký tài khoản " + appName + ". Để hoàn tất đăng ký, vui lòng sử dụng mã xác thực sau:</p>" +
               "<div class='code'>" + code + "</div>" +
               "<p>Mã này sẽ hết hạn sau " + resetCodeExpiryMinutes + " phút.</p>" +
               "<p>Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email hoặc liên hệ đội ngũ hỗ trợ.</p>" +
               "<p><a href='mailto:support@" + appName.toLowerCase().replace(" ", "") + ".com'>Liên hệ Hỗ trợ</a></p>" +
               "<div class='footer'>" +
               "<p>© " + LocalDateTime.now().getYear() + " " + appName + ". Bảo lưu mọi quyền.</p>" +
               "</div>" +
               "</div>" +
               "</body></html>";
    }
}
