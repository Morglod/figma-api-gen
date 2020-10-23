import * as Figma from 'figma-api';
import { JSONSchema4 } from 'json-schema';
import { validate } from './validate';
import * as tsargs from 'tsargs';

// https://www.figma.com/file/QF45UlnaxtIWB5hT75yiX2/figma-api-gen-tests?node-id=0%3A1

export const testFileKey = 'QF45UlnaxtIWB5hT75yiX2';

export class Tester {
    api: Figma.Api;
    fileKey: string;

    constructor(params: {
        accessToken: string,
        fileKey: string
    }) {
        this.api = new Figma.Api({
            personalAccessToken: params.accessToken,
        });
        this.fileKey = params.fileKey;
    }

    testNodes = async (schema: JSONSchema4, nodes: { [nodeId: string]: Figma.NodeType|'Node' }, opts: tsargs.Arg3<Figma.Api["getFileNodes"]>) => {
        const file = await this.api.getFileNodes(this.fileKey, Object.keys(nodes), opts);
        return validate(schema, nodes, file.nodes);
    };
}