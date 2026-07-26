create workspace/child-keys page that allow users to create a child key
Functionality:

- list all the child keys that belong to the workspace, including their name, tags, and created_at, updated_at timestamps.
- create a new child key with a name, tags, and automatically generate a api key, reveal the api key in the user interface.
- The key should start with sk_live_ and it's a json web token, using JWT_SIGNING_SECRET to sign the token.
- along to the child api key, toggle the activate or deactivate the child key.
- the tags usually include project,team, application,owner etc but not required.
- The payload of keys should be in the following format:
- functions to sign the token using JWT_SIGNING_SECRET, or verify the token using JWT_SIGNING_SECRET, decrypt the token to get the payload.

```json
{
  "key_id": "id", // this is th id of child key of  prisma schema
  "name": "child_key_name", // this is th name of child key of prisma schema
  "policy_id": "policy_id", // this is th id of policy of  prisma schema but we haven't created it yet, optional
  "tags": {
    // the tags from child key object of Prisma schema
    "env": "env_name", // optional
    "project": "project_name", // optional
    "team": "team_name", // optional
    "application": "application_name" // optional
  },
  "user_email": "user_email", // required
  "creator_email": "creator_email", // required
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

schema of prisma

```prisma
model ChildKey {
  id        String    @id
  name      String
  key       String
  creatorId String
  creator   User      @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  userEmail String
  tags      Json      @default("{}")
  expiresAt DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@index([tags(ops: JsonbPathOps)], type: Gin)
}

```

Follow the existing development conventions, creating server action for backend manipulation, shadcn ui aligned to the existing ui design.
