// Raw values are only banned where a design token with that exact value exists; off-scale values (10px, 13px) pass.
const px = (list) => new RegExp(`(^|[\\s(*+-])(${list})px\\b`);

export default {
  extends: ['stylelint-config-standard'],
  rules: {
    'import-notation': 'string', // url() stops Tailwind from processing the imports
    'at-rule-prelude-no-invalid': [true, { ignoreAtRules: ['apply'] }],
    'no-descending-specificity': null, // component overrides are deliberate; reordering rules risks changing the cascade
    'color-no-hex': true,
    'function-disallowed-list': ['rgb', 'rgba', 'hsl', 'hsla'],
    'declaration-property-value-disallowed-list': {
      '/^(padding|margin|gap|row-gap|column-gap|top|right|bottom|left)(-|$)/': [
        px('4|8|12|16|20|24|32|40|48|64'),
      ],
      '/^(min-|max-)?(width|height)$/': [px('32|40|44|48')],
      'border-radius': [px('4|8|12|16|28')],
      'font-size': [px('11|12|14|16|20|24|28|36')],
      'line-height': [px('16|20|24|28|32|36|44')],
      '/^(border(-(top|right|bottom|left))?|outline)(-width|-offset)?$/': [px('1|2|3')],
      'z-index': [/^[1-9]\d*$/],
    },
  },
};
