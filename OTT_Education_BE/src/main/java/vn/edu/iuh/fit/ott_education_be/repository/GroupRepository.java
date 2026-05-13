
package vn.edu.iuh.fit.ott_education_be.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import vn.edu.iuh.fit.ott_education_be.model.Group;

import java.util.List;



@Repository
public interface GroupRepository extends MongoRepository<Group, String> {
    List<Group> findByMemberIdsContaining(String userId);

}
