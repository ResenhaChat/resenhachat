import { Me } from '@models/ChatService';
import { ProfileService } from '@/services/profile';
import { ProfileController } from './protocols';
import { BaseControllerImplementation } from '../base/implementation';

export class ProfileControllerImplementation extends BaseControllerImplementation<Me> implements ProfileController {

    constructor(protected readonly Service: ProfileService) {

        super();

    }

}
