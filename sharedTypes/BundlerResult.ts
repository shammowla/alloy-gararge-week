import { string } from "../alloy/src/utils/validation";
import BundlerChunk from "./BundlerChunk";

export interface BundlerSuccessResult {
  success: true;
  elapsedTime: number;
  chunks: BundlerChunk[];
}

export interface BundlerFailureResult {
  success: false;
  elapsedTime: number;
  message: string;
}

type BundlerResult = BundlerSuccessResult | BundlerFailureResult;

export default BundlerResult;
