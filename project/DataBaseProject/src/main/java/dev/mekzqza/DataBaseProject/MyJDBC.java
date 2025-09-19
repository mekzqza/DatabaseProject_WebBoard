package dev.mekzqza.DataBaseProject;


import java.sql.*;


public class MyJDBC {



//    public static void main(String[] args) {
//       databaseCommands("SELECT * FROM user");
//    }
//asdasd

    public void databaseCommands(String command){

        try{
            Connection connection = DriverManager.getConnection(
                    "jdbc:mysql://127.0.0.1:3307/login_schema",
                    "root",
                    "mek0934396759"
            );
            Statement statement = connection.createStatement();
            ResultSet resultSet = statement.executeQuery(command);

            while (resultSet.next()){
                System.out.println(resultSet.getString("username"));
                System.out.println(resultSet.getString("password"));
            }

        }catch (SQLException e){
            e.printStackTrace();
        }
    }


}
