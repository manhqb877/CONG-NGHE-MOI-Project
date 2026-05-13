

package vn.edu.iuh.fit.ott_education_be.controller.request;

import lombok.Getter;
import vn.edu.iuh.fit.ott_education_be.common.Gender;
import vn.edu.iuh.fit.ott_education_be.common.UserStatus;

import java.util.Date;

@Getter
public class UserUpdateRequest {
    private String firstName;
    private String lastName;
    private Date birthday;
    private String email;
    private String phone;
    private Gender gender;
}
