import type { CodeFile, ProgrammingLanguage } from '../types/analysis';

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

export const SAMPLE_PYTHON_PROJECT: CodeFile[] = [
  {
    fileName: 'order_service.py',
    content: `from payment_service import PaymentService

class OrderService:
    def __init__(self):
        # Direct instantiation causes tight coupling
        self.payment = PaymentService()

    def processOrder(self, order_id: str, items=[]):
        # Mutable default argument bug & camelCase PEP8 violation
        print("Processing order: " + order_id)
        return self.payment.execute_payment(order_id, items)

    def on_complete(self, order_id: str):
        print("Order finished: " + order_id)
`,
  },
  {
    fileName: 'payment_service.py',
    content: `from order_service import OrderService

class PaymentService:
    def __init__(self):
        # Circular import relationship with order_service
        self.orders = OrderService()

    def execute_payment(self, order_id: str, items):
        try:
            print("Processing transaction for: " + order_id)
            self.orders.on_complete(order_id)
            return True
        except:
            # Bare except masks system interrupts and bugs
            print("Payment execution failed")
            return False
`,
  },
  {
    fileName: 'customer.py',
    content: `class customer:
    def __init__(self, name: str, email: str):
        self.name = name
        self.email = email
`,
  },
];

export const SAMPLE_TYPESCRIPT_PROJECT: CodeFile[] = [
  {
    fileName: 'OrderService.ts',
    content: `import { PaymentService } from './PaymentService';

export class OrderService {
    // Direct instantiation breaks Dependency Inversion
    private paymentService = new PaymentService();

    public processOrder(orderId: string, metadata: any) {
        // Deprecated 'var' and loose equality
        var isPriority = metadata.priority == true;
        
        console.log("Processing order " + orderId);
        return this.paymentService.charge(orderId, isPriority);
    }

    public handleSuccess(orderId: string) {
        console.log("Order confirmed: " + orderId);
    }
}
`,
  },
  {
    fileName: 'PaymentService.ts',
    content: `import { OrderService } from './OrderService';

export class PaymentService {
    // Circular dependency with OrderService
    private orderService: OrderService | null = null;

    public charge(orderId: string, priority: boolean): boolean {
        console.log("Charging order: " + orderId);
        if (this.orderService) {
            this.orderService.handleSuccess(orderId);
        }
        return true;
    }
}
`,
  },
  {
    fileName: 'CustomerDto.ts',
    content: `export interface CustomerDto {
    id: string;
    name: string;
    email: string;
}
`,
  },
];

export const SAMPLE_JAVASCRIPT_PROJECT: CodeFile[] = [
  {
    fileName: 'OrderService.js',
    content: `const PaymentService = require('./PaymentService');

class OrderService {
    constructor() {
        this.payment = new PaymentService();
    }

    process(orderId, amount) {
        var status = "pending";
        if (amount == 0) {
            console.log("Empty amount warning");
        }
        return this.payment.charge(orderId, amount);
    }
}

module.exports = OrderService;
`,
  },
  {
    fileName: 'PaymentService.js',
    content: `class PaymentService {
    charge(orderId, amount) {
        console.log("Charging " + orderId + " with amount " + amount);
        return true;
    }
}

module.exports = PaymentService;
`,
  },
];

export function getSampleProject(language: ProgrammingLanguage): CodeFile[] {
  switch (language) {
    case 'PYTHON':
      return SAMPLE_PYTHON_PROJECT;
    case 'TYPESCRIPT':
      return SAMPLE_TYPESCRIPT_PROJECT;
    case 'JAVASCRIPT':
      return SAMPLE_JAVASCRIPT_PROJECT;
    case 'JAVA':
    default:
      return SAMPLE_JAVA_PROJECT;
  }
}

export function getBlankProject(language: ProgrammingLanguage): CodeFile[] {
  switch (language) {
    case 'JAVA':
      return [
        {
          fileName: 'Main.java',
          content: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n`,
        },
      ];
    case 'PYTHON':
      return [
        {
          fileName: 'main.py',
          content: `def main():\n    print("Hello, World!")\n\nif __name__ == '__main__':\n    main()\n`,
        },
      ];
    case 'TYPESCRIPT':
      return [
        {
          fileName: 'index.ts',
          content: `console.log("Hello, World!");\n`,
        },
      ];
    case 'JAVASCRIPT':
      return [
        {
          fileName: 'index.js',
          content: `console.log("Hello, World!");\n`,
        },
      ];
    default:
      return [];
  }
}

export function getStarterProject(language: ProgrammingLanguage): CodeFile[] {
  return getBlankProject(language);
}

