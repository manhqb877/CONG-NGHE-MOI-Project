/*
 * @ (#) FriendRequestResponse.java       1.0     1/12/2025
 *
 * Copyright (c) 2025. All rights reserved.
 */

package vn.edu.iuh.fit.ott_education_be.controller.response;
/*
 * @description: Response object for friend requests
 * @date: 1/12/2025
 */

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import vn.edu.iuh.fit.ott_education_be.common.UserActiveStatus;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class FriendRequestResponse {
    private String requestId;
    private String id;
    private String senderId;
    private String name;
    private String lastName;
    private String avatar;
    private String phone;
    private UserActiveStatus activeStatus;
}
