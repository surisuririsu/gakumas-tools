# gakumas-data

Data utilities for Gakumas-related projects in JavaScript.

## Usage

To use, import the relevant classes and access the data via static methods.

### Example

```
import { Idols, PIdols, SkillCards } from 'gakumas-data';

const ybbKotone = PIdols.getById(32);
const kotone = Idols.getById(ybbKotone.idolId);
const allSkillCards = SkillCards.getAll();
const mentalSSRSkillCards = SkillCards.getFiltered({ types: ['mental'], rarities: ['SSR'] });
...
```

## Data

Data is manually transcribed and maintained in this Google Sheet: [Gakumas Data](https://docs.google.com/spreadsheets/d/19E3wGFhnmcK9jdP8dTIFo0_XUx1jCqYGvzzGAXQqaq4/view)

### Updating data

1. Fork the project.
2. Make a copy of the Google Sheet with your changes.
3. Download the sheet as CSV and replace the content of the relevant file in the project.
4. Run `npm run generate` or `yarn generate` to update the corresponding JSON files.
5. Bump the version number in `package.json` and commit your changes.
6. Make a pull request.
