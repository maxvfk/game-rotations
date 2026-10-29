export type InputKind = 'intro' | 'outro' | 'swap' | 'basic' | 'heavy' | 'skill' | 'ultimate' | 'echo' | 'dodge' | 'auto';
export type Action = {text:string;tone:'normal'|'key'|'vital'|'swap'|'flow'|'sensitive';input:{kind:InputKind;count?:number;repeat?:boolean;target?:string}};
export type RotationStage = {person:string;title:string;sub:string;actions:Action[];check:string;extra:string};
export type RotationCharacter = {id:string;name:string;glyph:string;color:string;portrait:string;investment:string};
export type RotationVariant = {id:string;label:string;sub:string;type:string;intro:string;verification:'adapted'|'partial'|'experimental'|'verified';opener:string[];loop:string[]};
export type RotationBook = {schemaVersion:1;id:string;game:string;title:string;gameVersion:string;source:string;verificationNote:string;characters:RotationCharacter[];controls:string;defaultSlots:Record<string,string>;variants:RotationVariant[];stages:Record<string,RotationStage>};
export type Scheme = {id:string;label:string;help:[string,string][];keys:Record<string,string>;slotKeys:Record<string,string>;slotExplain:string;summary:string};
export type ControlMap = {schemaVersion:1;game:string;schemes:Scheme[]};
