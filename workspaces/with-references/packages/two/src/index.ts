export class Quarterback {
    constructor(private _name: string = "Nick Foles") { }

    throw() {
        console.log(`${this._name} is throwing the ball`);
    }
}

export namespace Quarterback {
    export function createManyQuarterbacks() {
        const qbFactory = new QuarterbackFactory(["Jalen Hurts", "Nick Foles", "Donovan McNabb", "Randall Cunningham"]);
        return qbFactory.createQuarterbacks();
    }
}

export class QuarterbackFactory implements QuarterbackFactory {
    constructor(private _names: string[]) { }

    public createQuarterbacks(): Quarterback[] {
        return this._names.map(name => new Quarterback(name));
    }
}

export interface QuarterbackFactory {
    createQuarterbacks(): Quarterback[];
}

export type QuarterbackType = "Pocket Passer" | "Dual Threat" | "Game Manager" | "Gunslinger";

export namespace QuarterbackType {
    export function getType(): QuarterbackType {
        const types: QuarterbackType[] = ["Pocket Passer", "Dual Threat", "Gunslinger"];
        return types[Math.floor(Math.random() * types.length)] as QuarterbackType;
    }
}

