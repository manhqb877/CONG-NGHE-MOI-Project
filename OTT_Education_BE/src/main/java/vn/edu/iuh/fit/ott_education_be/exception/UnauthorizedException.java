package vn.edu.iuh.fit.ott_education_be.exception;

import org.springframework.http.HttpStatus;

public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException(HttpStatus unauthorized, String message) {
        super(message);
    }
}
