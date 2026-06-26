import { Component, Input,Output,EventEmitter } from '@angular/core';

@Component({
  selector: 'app-conferma-box',
  imports: [],
  templateUrl: './conferma-box.html',
  styleUrl: './conferma-box.css',
  standalone: true
})
export class ConfermaBox {
  @Input() messaggio = 'Sei sicuro di voler procedere?';
  @Output() risposta = new EventEmitter<boolean>();

  rispondi(scelta: boolean) {
    this.risposta.emit(scelta);
  }
}
