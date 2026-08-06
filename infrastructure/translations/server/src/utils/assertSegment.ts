import { SAFE_SEGMENT } from "../configs/constants.ts";

function isSegmentSafe<T extends string>(segment?: T): segment is T {
    return segment ? SAFE_SEGMENT.test(segment) : false;
}

export default isSegmentSafe;
