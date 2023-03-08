import * as _ from "lodash"

export namespace Utils {
  export function basename(path: string) {
    return _.last(path.split(/\/+/)) || "";
  }
}
