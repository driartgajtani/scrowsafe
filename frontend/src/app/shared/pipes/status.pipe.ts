import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'statusLabel', standalone: true })
export class StatusLabelPipe implements PipeTransform {
  private readonly labels: Record<string, string> = {
    pending: 'Pending',
    payment_received: 'Payment Received',
    credentials_received: 'Credentials Received',
    takeover_in_progress: 'Takeover In Progress',
    completed: 'Completed',
    refunded: 'Refunded',
    disputed: 'Disputed',
  };

  transform(value: string): string {
    return this.labels[value] ?? value;
  }
}

@Pipe({ name: 'statusColor', standalone: true })
export class StatusColorPipe implements PipeTransform {
  private readonly colors: Record<string, string> = {
    pending: 'warn',
    payment_received: 'accent',
    credentials_received: 'accent',
    takeover_in_progress: 'primary',
    completed: 'primary',
    refunded: 'warn',
    disputed: 'warn',
  };

  transform(value: string): string {
    return this.colors[value] ?? 'default';
  }
}
