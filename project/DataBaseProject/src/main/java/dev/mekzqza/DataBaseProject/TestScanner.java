package dev.mekzqza.DataBaseProject;

import java.util.Scanner;

public class TestScanner {


//--------TEST SCANNER + PULL DATABASE


    public static void main(String[] args) {
        Scanner scanner =new Scanner(System.in);
        MyJDBC myJDBC =new MyJDBC();

        String command = scanner.nextLine();

        myJDBC.databaseCommands(command);
    }


}

