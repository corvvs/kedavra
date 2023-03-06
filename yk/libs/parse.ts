import { StudentRaw } from "./definitions"

// 生徒データをパースする

export namespace Parser {
  export function is_integral_feature(name: string) {
    return name === "index";
  }
  
  export function is_string_feature(name: string) {
    return ["hogwarts_house", "first_name", "last_name", "birthday", "best_hand"].includes(name);
  }
  
  export function is_float_feature(name: string) {
    return !is_integral_feature(name) && !is_string_feature(name);
  }

  /**
   * CSVの行`line`を StudentRaw として解釈する.
   * その際フィールド名`field_names`を使う.
   * @param line 
   * @param field_names 
   * @returns 
   */
  export function parse_line_as_student(line: string, field_names: string[]): StudentRaw {
    const items = line.split(",");
    const r: any = {};
    r.scores = {};
    items.forEach((s, i) => {
      const name = field_names[i];
      if (is_integral_feature(name)) {
        // integral field
        r.index = parseInt(s);
      } else if (is_string_feature(name)) {
        // string field
        r[name] = s;
      } else if (is_float_feature(name)) {
        // float field
        r.scores[name] = parseFloat(s);
      }
    });
    return r;
  }

  /**
   * 生徒データ`r`のカテゴリカル変数を数値化して`r.scores`に書き込む
   * @param r 
   */
  export function quantize_categoricals(r: StudentRaw) {
    r.scores.is_left = r.best_hand === "Left" ? 1 : 0;
    r.scores.is_r = r.hogwarts_house === "Ravenclaw" ? 1 : 0;
    r.scores.is_s = r.hogwarts_house === "Slytherin" ? 1 : 0;
    r.scores.is_g = r.hogwarts_house === "Gryffindor" ? 1 : 0;
    r.scores.is_h = r.hogwarts_house === "Hufflepuff" ? 1 : 0;  
  }
}
