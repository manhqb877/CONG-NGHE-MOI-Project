
package vn.edu.iuh.fit.ott_education_be.controller.request;

import lombok.Getter;

@Getter
public class ResetPasswordRequest {
    private String token;
    private String newPassword;
}
