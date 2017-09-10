# Query Router

Es una pequeña librería para la gestión de rutas, esta permite construir rutas en base a un formato de escritura simple, traduciendo todo este formato a expresiones regulares, para una fácil comparación y descomposición.

## Query

Este permite generar un formato de consulta sobre el parámetro a comparar

#### Ejemplo

```javascript
import {Parse} from 'query-router';

let query   = new Parse('/user/param(first_name,last_name)');

let resolve = query.match('/user/matias/trujillo');

if( resolve ){
   console.log(`Hello ${resolve.first_name} ${resolve.last_name}`)
}
```
## Funciones por defecto

#### param()

Permite definir la obtención de un parámetro:

#### parámetro obligatorio

Se escribe solo el nombre con el que se rescatara de la comparación, sin el uso de decoradores

```javascript
import {Parse} from 'query-router';

let query   = new Parse('/param(first_name)');
```

#### parámetro Opcional

Se añade el decorador de **?** despues del nombre, este permite definir un parámetro opcional

```javascript
import {Parse} from 'query-router';

let query   = new Parse('/param(first_name?)');
```

#### parametro ilimitado

Se añade el decorador de **...** despues del nombre, este permite definir un parámetro ilimitado

```javascript
import {Parse} from 'query-router';

let query   = new Parse('/param(...all_content)');
```

#### ejemplo completo

```javascript
import {Parse} from 'query-router';
let query   = new Parse('/param( type )/user/param( first_name, last_name, ...all_content )');
```

#### not()

Permite encontrar en base a que no sea equivalente al parámetro entregado a not

```javascript
import {Parse} from 'query-router';
let query   = new Parse('/not(matias,user_acepted)');

let resolve = query.match('/jeral');

if( resolve ){
   console.log( resolve.user_acepted )
}

```

> si a resolve no se le asigna un nombre para la captura, este no sera almacenado, a su vez también puede usar el decorador opcional **?**

#### any()

permite aceptar cualquier valor fuera de **/**, a su vez ud puede hacer uso del  decorador **"*"**, dentro de any para completar un valor cualquiera

```javascript
import {Parse} from 'query-router';
let query   = new Parse('/any()/any(image.*)');

let resolve = query.match('/jeral');

```


