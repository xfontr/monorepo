import { SAFE_SEGMENT } from "../configs/constants.ts";

const isSegmentSafe = <T extends string>(segment?: T): segment is T =>
    segment ? SAFE_SEGMENT.test(segment) : false;

export default isSegmentSafe;
