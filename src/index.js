import { parsePDF } from './core/basic';

export class BillBreeze {

    constructor (){
    }

    load ( buffer ){
        return parsePDF( buffer );
    }
}
