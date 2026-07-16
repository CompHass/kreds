# Avatar assets — Phase 14

Final files served by the app live in THIS directory as optimized webp
(256×256, center-cropped square), named `<preset>.webp`. If a file is missing
the UI falls back to an emoji stand-in (see `src/lib/avatars/presets.ts` /
`ChildAvatar`) — never a broken image.

Originals live in `raw/` (png/webp, any size). To (re)generate the optimized
files from raw:

```bash
pnpm dlx sharp-cli --input public/avatars/raw/<name>.<ext> \
  --output public/avatars/<name>.webp resize 256 256 --fit cover
```

| File | Label (picker) | Character |
|---|---|---|
| `leaft.webp` | Folhinha | kid with orange leaf hair and green leaf dress |
| `sprout.webp` | Brotinho | brown-bodied kid, two leaves on head, sun on chest |
| `seed.webp` | Sementinha | round white head with a sprout, in a soil pot |
| `vase.webp` | Vasinho | walking flower pot with a sprout |
| `oak.webp` | Bolota | kid with acorn-cap hat and orange scarf |
| `mushroom.webp` | Cogumelo | red-cap white-dot mushroom holding a violin |
| `toadstool.webp` | Cogumelinho | orange-cap mushroom with white dots on grass |
| `scarecrow.webp` | Espantalho | scarecrow with brown hat, straw hands/feet |
| `tree.webp` | Árvore | wooden tree figure with felt pom-pom foliage |
| `tree2.webp` | Arvorezinha | cartoon tree, green bubble foliage on dirt mound |
| `flowergirl.webp` | Florzinha | wooden girl with big pink flower petals |
| `leafgirl.webp` | Fadinha | autumn leaf kid with rainbow petal skirt |
| `leaftbaby.webp` | Bebê Folha | big-eyed green baby with leaf head |
| `plantkid.webp` | Plantinha | moss/sprout creature with green sprout hair |

The `initial` preset has no asset — it renders the child's initial over the
accent color (legacy Phase 8 behavior).
