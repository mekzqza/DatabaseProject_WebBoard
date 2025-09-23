package ModulesClass;

import dev.mekzqza.DataBaseProject.MyJDBC;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private MyJDBC myJDBC;

    @Autowired  // Spring จะ inject MyJDBC ผ่าน setter
    public void setMyJDBC(MyJDBC myJDBC) {
        this.myJDBC = myJDBC;
    }

    public void addNewUser(String username, String password) {
        // ใช้ myJDBC เพื่อเพิ่มข้อมูลผู้ใช้ในฐานข้อมูล
        myJDBC.addNewUser(username, password);
    }

//    public void upDateUsername(String userID, String newUsername){
//        myJDBC.updateUserName(userID,newUsername);
//    }
//
//    public void upDateUserPassword(String userid ,String password){
//        myJDBC.updateUserPassword(userid,password);
//    }


//    public void Start(){
//        UserService userService = new UserService();
//        MyJDBC myJDBC1 =new MyJDBC();
//        userService.setMyJDBC(myJDBC1);
//        userService.addNewUser("kuyyy","yaiii");
//    }


}
