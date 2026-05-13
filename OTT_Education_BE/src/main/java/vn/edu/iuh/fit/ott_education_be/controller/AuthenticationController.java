
package vn.edu.iuh.fit.ott_education_be.controller;


import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.edu.iuh.fit.ott_education_be.controller.request.SignInRequest;
import vn.edu.iuh.fit.ott_education_be.controller.request.UserRegisterRequest;
import vn.edu.iuh.fit.ott_education_be.controller.request.VerifyEmailRequest;
import vn.edu.iuh.fit.ott_education_be.controller.response.RegisterResponse;
import vn.edu.iuh.fit.ott_education_be.controller.response.SignInResponse;
import vn.edu.iuh.fit.ott_education_be.exception.UnauthorizedException;
import vn.edu.iuh.fit.ott_education_be.service.AuthenticationService;
import vn.edu.iuh.fit.ott_education_be.service.UserService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@Slf4j(topic = "AUTHENTICATION-CONTROLLER")
@RequiredArgsConstructor
@RequestMapping("/auth")
public class AuthenticationController {
    private final AuthenticationService authenticationService;
    private final UserService userService;

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập vào ứng dụng", description = "Endpoint này cho phép người dùng đăng nhập vào ứng dụng.")
    public SignInResponse login(@RequestBody SignInRequest request) {
        log.info("Login request: {}", request);

        return authenticationService.getAccessToken(request);
    }

    @PostMapping("/register")
    @Operation(summary = "Đăng ký tài khoản mới", description = "Endpoint này cho phép người dùng đăng ký một tài khoản mới.")
    public RegisterResponse register(@RequestBody UserRegisterRequest request) {
        log.info("Register request: {}", request);

        return userService.register(request);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> requestResetPassword(@RequestBody Map<String, String> request){
        String email = request.get("email");
        log.info("Request reset password for email: {}", email);

        try{
            userService.requestPasswordReset(email);
            return ResponseEntity.ok(Map.of("message", "Đã gửi link đặt lại mật khẩu đến email của bạn"));
        }catch (ResponseStatusException e) {
            log.error("Lỗi khi xử lý yêu cầu đặt lại mật khẩu cho email {}: {}", email, e.getMessage());
            return ResponseEntity.status(e.getStatusCode())
                    .body(Map.of("error", e.getReason()));
        } catch (Exception e) {
            log.error("Lỗi không mong đợi khi xử lý yêu cầu đặt lại mật khẩu: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Gửi link đặt lại thất bại"));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody Map<String, String> request) {
        String code = request.get("code");
        String password = request.get("password");
        try {
            userService.resetPassword(code, password);
            return ResponseEntity.ok(Map.of("message", "Đặt lại mật khẩu thành công"));
        } catch (UnauthorizedException | ResponseStatusException e) {
            log.error("Lỗi khi đặt lại mật khẩu: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Lỗi không mong đợi khi đặt lại mật khẩu: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Đặt lại mật khẩu thất bại"));
        }
    }

    @PostMapping("/verify-email")
    public ResponseEntity<Void> sendVerificationEmail(@RequestBody String email) {
        log.info("Đang gửi email xác thực đến: {}", email);
        userService.sendVerificationEmail(email);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @PostMapping("/verify-email-code")
    public ResponseEntity<RegisterResponse> verifyEmail(@RequestBody VerifyEmailRequest request) {
        log.info("Đang xác thực email với mã: {}", request.getCode());
        RegisterResponse response = userService.verifyEmail(request);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
