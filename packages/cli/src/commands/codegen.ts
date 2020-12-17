import {Command, flags} from '@oclif/command';
import {generateSchema} from '../controller/codegen-controller';

export default class Codegen extends Command {
  static description = 'Generate schemas for graph node';

  static flags = {
    // can pass either --force or -f
    force: flags.boolean({char: 'f'}),
    file: flags.string(),
    /*
    schema: flags.boolean({
      description: 'Generate schema from GraphQL',
    }),
    database: flags.boolean({
      required: false,
      description: 'Build database from schema',
    }),

     */
  };

  async run(): Promise<void> {
    this.log('*********************************');
    this.log('Codegen from schema');
    this.log('*********************************');
    generateSchema();
  }
}
