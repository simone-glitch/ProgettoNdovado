import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Alert} from '../components/alert/alert';
import {ConfermaBox} from '../components/conferma-box/conferma-box';

@NgModule({
  declarations:[],
  imports:[
    CommonModule,
    Alert,
    ConfermaBox
  ],
  exports:[
    Alert,
    ConfermaBox
  ]
})

export class SharedModule {

}
