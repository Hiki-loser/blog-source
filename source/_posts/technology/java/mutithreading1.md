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
#### 3.线程安全
线程安全是指在多线程环境下，程序能够正确地处理共享资源，避免数据不一致和竞争条件。线程安全的程序可以在多个线程同时访问共享资源时保持正确的行为。
#### 4.为什么需要多线程
- 提高程序的效率：多线程可以同时执行多个任务，充分利用CPU资源。
- 提高程序的响应能力：多线程可以让程序在执行长时间任务时保持响应。
- 提高CPU利用率：多线程可以让CPU在等待I/O操作时执行其他任务。
- 异步处理：多线程可以让程序在等待某些操作完成时继续执行其他任务。
#### 5.并发编程三大原则
- 原子性：一个操作要么全部执行成功，要么全部执行失败，不会被其他线程打断。
- 可见性：一个线程对共享变量的修改对其他线程是可见的。
- 有序性：程序执行的顺序按照代码的顺序执行，不会被编译器或处理器<span class="hover-tip" data-tip="处理器重排序：JVM 可能会对没有依赖关系的指令进行重排以优化性能，但在并发场景下可能导致可见性与时序问题。比如在一个线程中先写一个共享变量再设置一个标志位，另一个线程先检查标志位再读取共享变量，如果发生重排序，可能导致另一个线程看到标志位已设置但共享变量未更新的情况。"tabindex="0">重排序</span>。

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
class Main {
    public static void main(String[] args) {
        MyThread thread = new MyThread();
        thread.start();
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
class Main {
    public static void main(String[] args) {
        Thread thread = new Thread(new MyRunnable());
        thread.start();
    }
}
```

- 使用 Callable 接口：创建一个新的类实现 Callable 接口，并实现 call() 方法。

```java
import java.util.concurrent.FutureTask;
import java.util.concurrent.Callable;
class MyCallable implements Callable<String> {
    @Override
    public String call() throws Exception {
        return "Thread is running";
    }
}
class Main {
    public static void main(String[] args) throws Exception {
        FutureTask<String> futureTask = new FutureTask<>(new MyCallable());
        Thread thread = new Thread(futureTask);
        thread.start();
        System.out.println(futureTask.get());
    }
}
```
- 使用jdk21虚拟线程：使用 Thread.startVirtualThread() 方法创建一个新的虚拟线程。

```java
class Main {
    public static void main(String[] args) {
        Thread.startVirtualThread(() -> {
            System.out.println("Virtual Thread is running");
        });
    }
}
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
import java.lang.Thread;
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
#### 3.线程同步与通信
线程同步是指多个线程访问共享资源时，确保资源的正确性和一致性。线程通信是指线程之间通过某种机制进行信息交换。
##### 1. 什么是锁及锁对象(Lock Object)

- 锁是用于控制对共享资源访问的机制。
- 锁对象是一个用于同步的对象，线程在访问共享资源时需要获取锁对象的锁。常见的锁对象有 synchronized 关键字、ReentrantLock 类等。当一个线程获取了锁对象的锁，其他线程就无法访问该资源，直到锁被释放。

```java
import java.util.concurrent.locks.ReentrantLock;
class Counter {
    private int count = 0;
    private final ReentrantLock lock = new ReentrantLock();
    public void increment() {   
        lock.lock(); // 获取锁
        try {
            count++; // 访问共享资源
        } finally {
            lock.unlock(); // 释放锁
        }
    }
    public int getCount() {
        return count;
    }
}
```

##### 2. synchronized 关键字：用于修饰方法或代码块，确保同一时间只有一个线程访问共享资源。
- 同步方法：当一个线程调用同步方法时，它会获取该方法所属对象的锁，其他线程无法访问该对象的任何同步方法，直到锁被释放。
- 同步静态方法：当一个线程调用同步静态方法时，它会获取该类的 Class 对象的锁，其他线程无法访问该类的任何同步静态方法，直到锁被释放。
- 同步代码块：可以在方法内部使用 synchronized 关键字创建一个同步代码块，指定一个锁对象来控制对共享资源的访问。

```java
class Counter {
    private int count = 0;
    public synchronized void increment() {
        count++; // 同步方法
    }
    public static synchronized void staticIncrement() {
        // 同步静态方法
    }
    public void methodWithSynchronizedBlock() {
        synchronized (this) {//使用当前对象作为锁
            // 同步代码块
        }
    }
    public int getCount() {
        return count;
    }
}
```

##### 3. volatile 关键字：用于修饰变量，确保变量的可见性和禁止指令重排序。
- 可见性：当一个线程修改了 volatile 变量的值，其他线程能够立即看到这个修改。volatile 变量的修改会被立即写入主内存，其他线程读取时会从主内存获取最新的值。
- 禁止指令重排序：volatile 变量的读写操作不会被编译器或处理器重排序，这保证了在多线程环境下的正确性.

```java
class SharedData {
    private volatile boolean flag = false;
    public void setFlag(boolean value) {
        flag = value; // 修改 flag 的值
    }
    public boolean getFlag() {
        return flag; // 读取 flag 的值
    }
}
```

##### 4. 线程通信：线程之间可以通过 wait()、notify() 和 notifyAll() 方法进行通信。这些方法必须在同步块或同步方法中使用。
- wait()：使当前线程进入等待状态，直到另一个线程调用 notify() 或 notifyAll() 方法唤醒它。
- notify()：唤醒一个正在等待的线程。唤醒的线程是随机选择的，如果有多个线程在等待，无法保证哪个线程会被唤醒。
- notifyAll()：唤醒所有正在等待的线程。

```java
class SharedResource {
    private boolean available = false;
    public synchronized void produce() throws InterruptedException {
        while (available) {
            wait(); // 等待资源不可用
        }
        // 生产资源
        available = true;
        notify(); // 通知消费者
    }
    public synchronized void consume() throws InterruptedException {
        while (!available) {
            wait(); // 等待资源可用
        }
        // 消费资源
        available = false;
        notify(); // 通知生产者
    }
}
```
#### 4.并发工具类
Java 提供了许多并发工具类来简化多线程编程，如 CountDownLatch、CyclicBarrier、Semaphore、Exchanger 等。这些工具类可以帮助我们更好地管理线程之间的协调和同步。
##### 1. CountDownLatch：一个同步辅助类，允许一个或多个线程等待直到在其他线程中执行的一组操作完成。
```java
import java.util.concurrent.CountDownLatch;
class Worker implements Runnable {
    private CountDownLatch latch;
    public Worker(CountDownLatch latch) {
        this.latch = latch;
    }
    @Override
    public void run() {
        try {
            // 执行任务
            Thread.sleep(1000);
            System.out.println("Worker finished");
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            latch.countDown(); // 任务完成，计数器减一
        }
    }
}
class Main {
    public static void main(String[] args) throws InterruptedException {
        CountDownLatch latch = new CountDownLatch(3);
        for (int i = 0; i < 3; i++) {
            new Thread(new Worker(latch)).start(); 
        }
        latch.await(); // 等待所有任务完成
        System.out.println("All workers finished");
    }
}
```
##### 2. CyclicBarrier：一个同步辅助类，允许一组线程互相等待，直到所有线程都达到某个公共屏障点。
```java
import java.util.concurrent.CyclicBarrier;
class Worker implements Runnable {
    private CyclicBarrier barrier;
    public Worker(CyclicBarrier barrier) {
        this.barrier = barrier;
    }
    @Override
    public void run() {
        try {
            // 执行任务
            Thread.sleep(1000);
            System.out.println("Worker finished");
            barrier.await(); // 等待其他线程到达屏障点
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
class Main {
    public static void main(String[] args) {    
        CyclicBarrier barrier = new CyclicBarrier(3, () -> {
            System.out.println("All workers finished");
        });
        for (int i = 0; i < 3; i++) {
            new Thread(new Worker(barrier)).start(); 
        }
    }
}
```
##### 3. Semaphore：一个计数信号量，控制同时访问某个资源的线程数量。
```java
import java.util.concurrent.Semaphore;
class Worker implements Runnable {
    private Semaphore semaphore;
    public Worker(Semaphore semaphore) {
        this.semaphore = semaphore;
    }
    @Override
    public void run() {
        try {
            semaphore.acquire(); // 获取许可
            // 执行任务
            Thread.sleep(1000);
            System.out.println("Worker finished"); 
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            semaphore.release(); // 释放许可
        }
    }
}
class Main {
    public static void main(String[] args) {
        Semaphore semaphore = new Semaphore(2); // 允许同时访问的线程数量为 2
        for (int i = 0; i < 5; i++) {
            new Thread(new Worker(semaphore)).start(); 
        }
    }
}
```
##### 4. Exchanger：一个用于线程之间交换数据的同步点。
```java
import java.util.concurrent.Exchanger;
class Worker implements Runnable {
    private Exchanger<String> exchanger;
    public Worker(Exchanger<String> exchanger) {
        this.exchanger = exchanger;
    }
    @Override
    public void run() {
        try {
            String data = "Data from " + Thread.currentThread().getName();
            String exchangedData = exchanger.exchange(data); // 交换数据
            System.out.println(Thread.currentThread().getName() + " exchanged data: " + exchangedData);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
class Main {
    public static void main(String[] args) {
        Exchanger<String> exchanger = new Exchanger<>();
        new Thread(new Worker(exchanger)).start();
        new Thread(new Worker(exchanger)).start();
        new Thread(new Worker(exchanger)).start();
    }
}
```
