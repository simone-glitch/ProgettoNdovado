import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Alert} from '../components/alert/alert';
import {ConfermaBox} from '../components/conferma-box/conferma-box';
import {TranslatePipe} from '../pipes/translate.pipe';

@NgModule({
  declarations:[],
  imports:[
    CommonModule,
    Alert,
    ConfermaBox,
    TranslatePipe,
  ],
  exports:[
    Alert,
    ConfermaBox,
    TranslatePipe,
  ]
})

export class SharedModule {

}
