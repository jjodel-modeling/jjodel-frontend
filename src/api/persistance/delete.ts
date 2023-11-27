import type {Pointer, DProject} from '../../joiner';
import Fetch from '../fetch';

export class Delete {
    private static url = '/persistance/';

    static async project(id: Pointer<DProject>): Promise<void> {
        const projectUrl = this.url + `projects/${id}`;
        await Fetch.delete(projectUrl);
    }


}
