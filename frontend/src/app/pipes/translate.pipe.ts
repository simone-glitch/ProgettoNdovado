import { Pipe, PipeTransform } from '@angular/core';
import { TranslationService } from '../services/translation.service';
import { Lang } from '../services/i18n/types';

@Pipe({ name: 'translate', standalone: true, pure: false })
export class TranslatePipe implements PipeTransform {
  constructor(private t: TranslationService) {}
  transform(key: string, forceLang?: Lang): string {
    return this.t.translate(key, forceLang);
  }
}
