
package vn.edu.iuh.fit.ott_education_be.service;


import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;

import vn.edu.iuh.fit.ott_education_be.repository.UserRepository;

@Service
public record UserServiceDetail(UserRepository userRepository) {
    public UserDetailsService userDetailsService() {
        return userRepository::findByUsername;
    }
}
