import type { Character } from "../types";

function charEntry(id: string, name: string, filename: string): Character {
  return {
    id,
    name,
    imageUrl: `/characters/${filename}.png`,
  };
}

export const CHARACTERS: Character[] = [
  // Base roster (32)
  charEntry("jin", "Jin Kazama", "jin"),
  charEntry("kazuya", "Kazuya Mishima", "kazuya"),
  charEntry("jun", "Jun Kazama", "jun"),
  charEntry("paul", "Paul Phoenix", "paul"),
  charEntry("law", "Marshall Law", "marshall"),
  charEntry("king", "King", "king"),
  charEntry("lars", "Lars Alexandersson", "lars"),
  charEntry("jack8", "Jack-8", "jack"),
  charEntry("yoshimitsu", "Yoshimitsu", "yoshimitsu"),
  charEntry("shaheen", "Shaheen", "shaheen"),
  charEntry("dragunov", "Dragunov", "dragunov"),
  charEntry("leo", "Leo Kliesen", "leo"),
  charEntry("steve", "Steve Fox", "steve"),
  charEntry("kuma", "Kuma", "kuma"),
  charEntry("xiaoyu", "Ling Xiaoyu", "ling"),
  charEntry("nina", "Nina Williams", "nina"),
  charEntry("asuka", "Asuka Kazama", "asuka"),
  charEntry("leroy", "Leroy Smith", "leroy"),
  charEntry("lili", "Lili", "lili"),
  charEntry("bryan", "Bryan Fury", "bryan"),
  charEntry("hwoarang", "Hwoarang", "hwoarang"),
  charEntry("claudio", "Claudio Serafino", "claudio"),
  charEntry("azucena", "Azucena", "azucena"),
  charEntry("raven", "Raven", "raven"),
  charEntry("devil-jin", "Devil Jin", "devil"),
  charEntry("reina", "Reina", "reina"),
  charEntry("lee", "Lee Chaolan", "lee"),
  charEntry("alisa", "Alisa Bosconovitch", "alisa"),
  charEntry("panda", "Panda", "panda"),
  charEntry("zafina", "Zafina", "zafina"),
  charEntry("victor", "Victor Chevalier", "victor"),
  charEntry("feng", "Feng Wei", "feng"),
  // DLC characters (7)
  charEntry("eddy", "Eddy Gordo", "eddy"),
  charEntry("lidia", "Lidia Sobieska", "lidia"),
  charEntry("heihachi", "Heihachi Mishima", "heihachi"),
  charEntry("anna", "Anna Williams", "anna"),
  charEntry("clive", "Clive Rosfield", "clive"),
  charEntry("fahkumram", "Fahkumram", "fahkumram"),
  charEntry("armor-king", "Armor King", "armor"),
];

export const CHARACTER_MAP = new Map(CHARACTERS.map((c) => [c.id, c]));
