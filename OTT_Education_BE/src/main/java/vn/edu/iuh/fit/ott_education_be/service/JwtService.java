

package vn.edu.iuh.fit.ott_education_be.service;


import vn.edu.iuh.fit.ott_education_be.common.TokenType;

public interface JwtService {
    String generateAccessToken(String userId, String username);

    String generateRefreshToken(String userId, String username);

    String generateResetToken(String userId);

    String extractUsername(String token, TokenType tokenType);

    void blackListToken(String token, TokenType type);
}
