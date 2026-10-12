import type { CodeFile } from '../types/analysis';

export const SAMPLE_JAVA_PROJECT: CodeFile[] = [
  {
    fileName: 'OrderService.java',
    content: `package ua.pnu.shop.service;

import java.util.UUID;

public class OrderService {

    // Direct instantiation breaks Dependency Inversion Principle
    private PaymentService paymentService = new PaymentService();

    public void processOrder(String orderId, double amount) {
        System.out.println("Processing order: " + orderId);

        if (amount <= 0) {
            throw new IllegalArgumentException("Invalid order amount");
        }

        paymentService.executePayment(orderId, amount);
    }

    public void notifyOrderCompleted(String orderId) {
        System.out.println("Order completed: " + orderId);
    }
}
`,
  },
  {
    fileName: 'PaymentService.java',
    content: `package ua.pnu.shop.service;

public class PaymentService {

    // Circular dependency: PaymentService references OrderService back
    private OrderService orderService;

    public void executePayment(String orderId, double amount) {
        try {
            System.out.println("Executing payment for order " + orderId + ": " + amount);
            
            // Simulating payment completion callback triggering circular call
            if (orderService != null) {
                orderService.notifyOrderCompleted(orderId);
            }
        } catch (Exception e) {
            // Masks unchecked runtime exceptions
            System.err.println("Payment failed: " + e.getMessage());
        }
    }
}
`,
  },
  {
    fileName: 'CustomerDto.java',
    content: `package ua.pnu.shop.dto;

import java.util.Objects;

// Redundant boilerplate POJO that could be a Java 21 record
public class CustomerDto {
    private String id;
    private String name;
    private String email;

    public CustomerDto(String id, String name, String email) {
        this.id = id;
        this.name = name;
        this.email = email;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof CustomerDto that)) return false;
        return Objects.equals(id, that.id) && Objects.equals(name, that.name) && Objects.equals(email, that.email);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, name, email);
    }
}
`,
  },
];
