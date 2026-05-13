

package vn.edu.iuh.fit.ott_education_be.controller.request;


import lombok.Getter;

@Getter
public class VerifyEmailRequest {
    private String email;
    private String code;
    private UserRegisterRequest userRegisterRequest;
}
