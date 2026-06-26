import { Component , Input, Output, EventEmitter} from '@angular/core';

@Component({
  selector: 'app-alert',
  imports: [],
  templateUrl: './alert.html',
  styleUrl: './alert.css',
})
export class Alert {
  @Input() type: 'success' | 'error' | 'info'|'warning' = 'info';
  @Input() message: string = '';
  @Output() dismissEvent = new EventEmitter<void>();

  dismiss() {
    this.dismissEvent.emit();
  }
}
