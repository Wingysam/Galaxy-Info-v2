# Galaxy Info API
You can access the data that Galaxy Info has collected through this API.

## Interactive API Documentation

**View the interactive Swagger UI documentation at `/api-docs`** (e.g., `http://localhost:3000/api-docs`)

The Swagger UI provides:
- Complete documentation of all API endpoints
- Interactive request/response testing
- Request/response schema definitions
- Authentication information

> Warning
>
> Some routes of this API require a token, to get one please contact Wingy#3538.
> You can use this token with the x-token header or ?token=...

<details>
<summary>v1</summary>

## v1
> DEPRECATED
>
> You shouldn't use this API now, but it should still work for now because I didn't want to break everything

### GET /v1/ship/:name
Get the data used to generate the embed in the !ship command

</details>

## v2
v2 of the api

For detailed endpoint documentation, please visit the Swagger UI at `/api-docs`.

### GET /v2/ships
`ships_read` | `ships_read_secret?`

List all ships and their stats

### POST /v2/ships
`ships_write`

Updates the stats for each ship provided. Example body:
```json
{
  "Wasp": {
    "
  }
}
```

### POST /v2/ships/:shipname
`ships_write`

Overwrite all properties for a ship. Deletes the ship from the database and reuploads it with the new data.

### PUT /v2/ships/:shipname
`ships_write`

Overwrite a few properties