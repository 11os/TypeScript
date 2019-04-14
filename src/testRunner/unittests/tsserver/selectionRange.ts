namespace ts.projectSystem {
    function setup(fileName: string, content: string) {
        const file: File = { path: fileName, content };
        const host = createServerHost([file, libFile]);
        const session = createSession(host);
        openFilesForSession([file], session);
        return function getSelectionRange(locations: protocol.SelectionRangeRequestArgs["locations"]) {
            return executeSessionRequest<protocol.SelectionRangeRequest, protocol.SelectionRangeResponse>(
                session,
                CommandNames.SelectionRange,
                { file: fileName, locations });
        };
    }

    describe("unittests:: tsserver:: selectionRange", () => {
        it("works for simple JavaScript", () => {
            const getSelectionRange = setup("/file.js", `
class Foo {
    bar(a, b) {
        if (a === b) {
            return true;
        }
        return false;
    }
}`);

            const locations = getSelectionRange([
                {
                    line: 4,
                    offset: 13,
                }, {
                    line: 5,
                    offset: 22,
                },
            ]);

            // Common to results for both locations
            const ifStatementUp: protocol.SelectionRange = {
                textSpan: { // IfStatement
                    start: { line: 4, offset: 9 },
                    end: { line: 6, offset: 10 } },
                parent: {
                    textSpan: { // SyntaxList + whitespace (body of method)
                        start: { line: 3, offset: 16 },
                        end: { line: 8, offset: 5 } },
                    parent: {
                        textSpan: { // MethodDeclaration
                            start: { line: 3, offset: 5 },
                            end: { line: 8, offset: 6 } },
                        parent: {
                            textSpan: { // SyntaxList + whitespace (body of class)
                                start: { line: 2, offset: 12 },
                                end: { line: 9, offset: 1 } },
                            parent: {
                                textSpan: { // ClassDeclaration
                                    start: { line: 2, offset: 1 },
                                    end: { line: 9, offset: 2 } },
                                parent: {
                                    textSpan: { // SourceFile (all text)
                                        start: { line: 1, offset: 1 },
                                        end: { line: 9, offset: 2 }, } } } } } } };

            assert.deepEqual(locations, [
                {
                    textSpan: { // a
                        start: { line: 4, offset: 13 },
                        end: { line: 4, offset: 14 } },
                    parent: {
                        textSpan: { // a === b
                            start: { line: 4, offset: 13 },
                            end: { line: 4, offset: 20 } },
                        parent: ifStatementUp } },
                {
                    textSpan: { // true
                        start: { line: 5, offset: 20 },
                        end: { line: 5, offset: 24 } },
                    parent: {
                        textSpan: { // return true;
                            start: { line: 5, offset: 13 },
                            end: { line: 5, offset: 25 } },
                        parent: {
                            textSpan: { // SyntaxList + whitespace (body of IfStatement)
                                start: { line: 4, offset: 23 },
                                end: { line: 6, offset: 9 } },
                            parent: ifStatementUp } } }
            ]);
        });

        it("works for simple TypeScript", () => {
            const getSelectionRange = setup("/file.ts", `
export interface IService {
    _serviceBrand: any;

    open(host: number, data: any): Promise<any>;
}`);
            const locations = getSelectionRange([
                {
                    line: 5,
                    offset: 12,
                },
            ]);

            assert.deepEqual(locations, [
                {
                    textSpan: { // host
                        start: { line: 5, offset: 10 },
                        end: { line: 5, offset: 14 } },
                    parent: {
                        textSpan: { // host: number
                            start: { line: 5, offset: 10 },
                            end: { line: 5, offset: 22 } },
                        parent: {
                            textSpan: { // host: number, data: any
                                start: { line: 5, offset: 10 },
                                end: { line: 5, offset: 33 } },
                            parent: {
                                textSpan: { // open(host: number, data: any): Promise<any>;
                                    start: { line: 5, offset: 5 },
                                    end: { line: 5, offset: 49 } },
                                parent: {
                                    textSpan: { // SyntaxList + whitespace (body of interface)
                                        start: { line: 2, offset: 28 },
                                        end: { line: 6, offset: 1 } },
                                    parent: {
                                        textSpan: { // InterfaceDeclaration
                                            start: { line: 2, offset: 1 },
                                            end: { line: 6, offset: 2 } },
                                        parent: {
                                            textSpan: { // SourceFile
                                                start: { line: 1, offset: 1 },
                                                end: { line: 6, offset: 2 } } } } } } } } },
            ]);
        });

        it("works for complex TypeScript", () => {
            const getSelectionRange = setup("/file.ts", `
type X<T, P> = IsExactlyAny<P> extends true ? T : ({ [K in keyof P]: IsExactlyAny<P[K]> extends true ? K extends keyof T ? T[K] : P[K] : P[K]; } & Pick<T, Exclude<keyof T, keyof P>>)
`);
            const locations = getSelectionRange([
                {
                    line: 2,
                    offset: 133,
                },
            ]);

            assert.deepEqual(locations, [
                {
                    textSpan: { // K
                        start: { line: 2, offset: 133 },
                        end: { line: 2, offset: 134 } },
                    parent: {
                        textSpan: { // P[K]
                            start: { line: 2, offset: 131 },
                            end: { line: 2, offset: 135 } },
                        parent: {
                            textSpan: { // K extends keyof T ? T[K] : P[K]
                                start: { line: 2, offset: 104 },
                                end: { line: 2, offset: 135 } },
                            parent: {
                                textSpan: { // IsExactlyAny<P[K]> extends true ? K extends keyof T ? T[K] : P[K] : P[K]
                                    start: { line: 2, offset: 70 },
                                    end: { line: 2, offset: 142 } },
                                parent: {
                                    textSpan: { // [K in keyof P]: IsExactlyAny<P[K]> extends true ? K extends keyof T ? T[K] : P[K] : P[K];
                                        start: { line: 2, offset: 54 },
                                        end: { line: 2, offset: 143 } },
                                    parent: {
                                        textSpan: { // MappedType: same as above + braces
                                            start: { line: 2, offset: 52 },
                                            end: { line: 2, offset: 145 } },
                                        parent: {
                                            textSpan: { // IntersectionType: { [K in keyof P]: ... } & Pick<T, Exclude<keyof T, keyof P>>
                                                start: { line: 2, offset: 52 },
                                                end: { line: 2, offset: 182 } },
                                            parent: {
                                                textSpan: { // same as above + parens
                                                    start: { line: 2, offset: 51 },
                                                    end: { line: 2, offset: 183 } },
                                                parent: {
                                                    textSpan: { // Whole TypeNode of TypeAliasDeclaration
                                                        start: { line: 2, offset: 16 },
                                                        end: { line: 2, offset: 183 } },
                                                    parent: {
                                                        textSpan: { // Whole TypeAliasDeclaration
                                                            start: { line: 2, offset: 1 },
                                                            end: { line: 2, offset: 183 } },
                                                        parent: {
                                                            textSpan: { // SourceFile
                                                                start: { line: 1, offset: 1 },
                                                                end: { line: 2, offset: 184 } } } } } } } } } } } } },
            ]);
        });

        it.skip("works for object types", () => {
            const getSelectionRange = setup("/file.js", `
type X = {
    foo?: string;
    readonly bar: { x: number };
}`);
            const locations = getSelectionRange([
                { line: 3, offset: 5 },
                { line: 4, offset: 5 },
                { line: 4, offset: 14 },
                { line: 4, offset: 27 },
            ]);

            const allMembersUp: protocol.SelectionRange = {
                textSpan: { // all members + whitespace (just inside braces)
                    start: { line: 2, offset: 11 },
                    end: { line: 5, offset: 1 } },
                parent: {
                    textSpan: { // add braces
                        start: { line: 2, offset: 10 },
                        end: { line: 5, offset: 2 } },
                    parent: {
                        textSpan: { // whole TypeAliasDeclaration
                            start: { line: 2, offset: 1 },
                            end: { line: 5, offset: 2 } },
                        parent: {
                            textSpan: { // SourceFile
                                start: { line: 1, offset: 1 },
                                end: { line: 5, offset: 2 } } } } } };

            const readonlyBarUp: protocol.SelectionRange = {
                textSpan: { // readonly bar
                    start: { line: 4, offset: 5 },
                    end: { line: 4, offset: 17 } },
                parent: {
                    textSpan: { // readonly bar: { x: number };
                        start: { line: 4, offset: 5 },
                        end: { line: 4, offset: 33 } },
                    parent: allMembersUp } };

            assert.deepEqual(locations![0], {
                textSpan: { // foo
                    start: { line: 3, offset: 5 },
                    end: { line: 3, offset: 8 } },
                parent: {
                    textSpan: { // foo?
                        start: { line: 3, offset: 5 },
                        end: { line: 3, offset: 9 } },
                    parent: {
                        textSpan: { // foo?: string;
                            start: { line: 3, offset: 5 },
                            end: { line: 3, offset: 18 } },
                        parent: allMembersUp } } });

            assert.deepEqual(locations![1], {
                textSpan: { // readonly
                    start: { line: 4, offset: 5 },
                    end: { line: 4, offset: 13 } },
                parent: readonlyBarUp });

            assert.deepEqual(locations![2], {
                textSpan: { // bar
                    start: { line: 4, offset: 14 },
                    end: { line: 4, offset: 17 } },
                parent: readonlyBarUp });

            assert.deepEqual(locations![3], {
                textSpan: { // number
                    start: { line: 4, offset: 24 },
                    end: { line: 4, offset: 30 } },
                parent: {
                    textSpan: { // x: number
                        start: { line: 4, offset: 21 },
                        end: { line: 4, offset: 30 } },
                    parent: {
                        textSpan: { // { x: number }
                            start: { line: 4, offset: 19 },
                            end: { line: 4, offset: 32 } },
                        parent: readonlyBarUp.parent } } });
        });

        it("works for string literals and template strings", () => {
            // tslint:disable-next-line:no-invalid-template-strings
            const getSelectionRange = setup("/file.ts", "`a b ${\n  'c'\n} d`");
            const locations = getSelectionRange([
                { line: 2, offset: 4 },
                { line: 1, offset: 4 },
            ]);
            assert.deepEqual(locations, [
                {
                    textSpan: { // c
                        start: { line: 2, offset: 4 },
                        end: { line: 2, offset: 5 } },
                    parent: {
                        textSpan: { // 'c'
                            start: { line: 2, offset: 3 },
                            end: { line: 2, offset: 6 } },
                        // parent: {
                        //     textSpan: { // just inside braces
                        //         start: { line: 1, offset: 8 },
                        //         end: { line: 3, offset: 1 } },
                            parent: {
                                textSpan: { // whole TemplateSpan: ${ ... }
                                    start: { line: 1, offset: 6 },
                                    end: { line: 3, offset: 2 } },
                                parent: {
                                    textSpan: { // whole template string without backticks
                                        start: { line: 1, offset: 2 },
                                        end: { line: 3, offset: 4 } },
                                    parent: {
                                        textSpan: { // whole template string
                                            start: { line: 1, offset: 1 },
                                            end: { line: 3, offset: 5 } } } } } } },
                {
                    textSpan: { // whole template string without backticks
                        start: { line: 1, offset: 2 },
                        end: { line: 3, offset: 4 } },
                    parent: {
                        textSpan: { // whole template string
                            start: { line: 1, offset: 1 },
                            end: { line: 3, offset: 5 } } } },
            ]);
        });

        it("works for ES2015 import lists", () => {
            const getSelectionRange = setup("/file.ts", `
import { x as y, z } from './z';
import { b } from './';

console.log(1);`);

            const locations = getSelectionRange([{ line: 2, offset: 10 }]);
            assert.deepEqual(locations, [
                {
                    textSpan: { // x
                        start: { line: 2, offset: 10 },
                        end: { line: 2, offset: 11 } },
                    parent: {
                        textSpan: { // x as y
                            start: { line: 2, offset: 10 },
                            end: { line: 2, offset: 16 } },
                        parent: {
                            textSpan: { // x as y, z
                                start: { line: 2, offset: 10 },
                                end: { line: 2, offset: 19 } },
                            parent: {
                                textSpan: { // { x as y, z }
                                    start: { line: 2, offset: 8 },
                                    end: { line: 2, offset: 21 } },
                                parent: {
                                    textSpan: { // import { x as y, z } from './z';
                                        start: { line: 2, offset: 1 },
                                        end: { line: 2, offset: 33 } },
                                    parent: {
                                        textSpan: { // all imports
                                            start: { line: 2, offset: 1 },
                                            end: { line: 3, offset: 24 } },
                                        parent: {
                                            textSpan: { // SourceFile
                                                start: { line: 1, offset: 1 },
                                                end: { line: 5, offset: 16 } } } } } } } } }
            ]);
        });

        it.skip("works for complex mapped types", () => {
            const getSelectionRange = setup("/file.ts", `
type M = { -readonly [K in keyof any]-?: any };`);

            const locations = getSelectionRange([
                { line: 2, offset: 12 }, // -readonly
                { line: 2, offset: 14 }, // eadonly
                { line: 2, offset: 22 }, // [
                { line: 2, offset: 30 }, // yof any
                { line: 2, offset: 38 }, // -?
                { line: 2, offset: 39 }, // ?
            ]);

            assert.deepEqual(locations![0], {
                textSpan: { // -
                    start: { line: 2, offset: 12 },
                    end: { line: 2, offset: 13 } },
                parent: {
                    textSpan: { // -readonly
                        start: { line: 2, offset: 12 },
                        end: { line: 2, offset: 21 } },
                    parent: {
                        textSpan: { // -readonly [K in keyof any]
                            start: { line: 2, offset: 12 },
                            end: { line: 2, offset: 38 } },
                        parent: {
                            textSpan: { // -readonly [K in keyof any]-?
                                start: { line: 2, offset: 12 },
                                end: { line: 2, offset: 40 } },
                            parent: {
                                textSpan: { // -readonly [K in keyof any]-?: any
                                    start: { line: 2, offset: 12 },
                                    end: { line: 2, offset: 45 } },
                                parent: {
                                    textSpan: { // { -readonly [K in keyof any]-?: any }
                                        start: { line: 2, offset: 10 },
                                        end: { line: 2, offset: 47 } },
                                    parent: {
                                        textSpan: { // whole line
                                            start: { line: 2, offset: 1 },
                                            end: { line: 2, offset: 48 } },
                                        parent: {
                                            textSpan: { // SourceFile
                                                start: { line: 1, offset: 1 },
                                                end: { line: 2, offset: 48 } } } } } } } } }
            });
        });
    });
}
