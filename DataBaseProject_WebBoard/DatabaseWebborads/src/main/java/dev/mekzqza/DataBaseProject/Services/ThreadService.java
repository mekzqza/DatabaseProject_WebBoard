package dev.mekzqza.DataBaseProject.Services;


import dev.mekzqza.DataBaseProject.ConnecDatabases.ThreadConnect;

public class ThreadService {

    ThreadConnect threadConnect = new ThreadConnect();
    public long createThread(long categoryId, long userId, String title, String content) {
        return threadConnect.newThread(categoryId, userId, title, content);
    }




}
