---
title: Java 多线程编程（一）
date: 2026-04-19 21:33:00
categories: technology/java
tags:
  - java
  - multithreading
description: Java 多线程编程入门，介绍线程的基本概念、创建线程的方法以及线程的生命周期。
cover:
---
# Java 多线程编程（一）

## 什么是多线程
多线程是指在一个程序中同时运行多个线程的能力。每个线程可以独立执行任务，但它们共享同一个进程的资源。多线程可以提高程序的效率和响应能力，特别是在处理大量数据或需要同时执行多个任务时。  

## 线程的基本概念

#### 1. 线程（Thread）
线程是程序执行的最小单位。每个线程都有自己的执行路径，可以独立执行任务。线程可以共享进程的资源，如内存和文件。
#### 2. 进程（Process）
进程是程序运行的一个实例，每个进程都有自己的内存空间和系统资源。一个进程可以包含多个线程，这些线程共享进程的资源。
#### 3. 线程调度
线程调度是操作系统管理线程执行的过程。调度器决定哪个线程在哪个时间段执行。线程调度可以是抢占式的，也可以是协作式的。
#### 4.为什么需要多线程
- 提高程序的效率：多线程可以同时执行多个任务，充分利用CPU资源。
- 提高程序的响应能力：多线程可以让程序在执行长时间任务时保持响应。
- 提高CPU利用率：多线程可以让CPU在等待I/O操作时执行其他任务。
- 异步处理：多线程可以让程序在等待某些操作完成时继续执行其他任务。

## 线程的创建与使用

#### 1.创建线程的四种方式

- 继承 Thread 类：创建一个新的类继承 Thread 类，并重写 run() 方法。

```java
class MyThread extends Thread {
    @Override
    public void run() {
        System.out.println("Thread is running");
    }
}
```
- 实现 Runnable 接口：创建一个新的类实现 Runnable 接口，并实现 run() 方法。

```java
class MyRunnable implements Runnable {
    @Override
    public void run() {
        System.out.println("Thread is running");
    }
}
```

- 使用 Callable 接口：创建一个新的类实现 Callable 接口，并实现 call() 方法。

```java
import java.util.concurrent.Callable;
class MyCallable implements Callable<String> {
    @Override
    public String call() throws Exception {
        return "Thread is running";
    }
}
```
- 使用jdk21虚拟线程：使用 Thread.startVirtualThread() 方法创建一个新的虚拟线程。

```java
Thread.startVirtualThread(() -> {
    System.out.println("Virtual Thread is running");
});
```

#### 2.线程的生命周期
线程的生命周期包括以下几个状态：
- 新建（New）：线程被创建但尚未启动。
- 就绪（Runnable）：线程已经准备好运行，等待CPU调度。
- 运行（Running）：线程正在执行任务。
- 等待（Waiting）：线程等待某个条件或事件发生。
- 阻塞（Blocked）：线程等待某个资源或条件满足。
- 死亡（Terminated）：线程执行完毕或被强制终止。
```java
public class ThreadStates {
   public static void main(String[] args) throws Exception {
       Thread thread = new Thread(() -> {
           try {
               Thread.sleep(2000); // TIMED_WAITING
               synchronized (ThreadStates.class) {
                   ThreadStates.class.wait(); // WAITING
               }
           } catch (InterruptedException e) {
                e.printStackTrace();
           }
       });
       
       System.out.println("新建状态: " + thread.getState()); // NEW
       
        thread.start();
       System.out.println("启动后状态: " + thread.getState()); // RUNNABLE
       
       Thread.sleep(100);
       System.out.println("运行中状态: " + thread.getState()); // TIMED_WAITING
       
       Thread.sleep(3000);
       synchronized (ThreadStates.class) {
           ThreadStates.class.notify(); // 唤醒线程
       }
       
       Thread.sleep(100);
       System.out.println("最终状态: " + thread.getState()); // TERMINATED
   }
}
```


