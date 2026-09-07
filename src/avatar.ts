import { File, Paths } from "expo-file-system";

const maxAvatarBytes = 12 * 1024 * 1024;
const localPrefix = "little-days-avatar-";

function extensionFor(uri: string) {
  const extension = /\.([a-zA-Z0-9]{2,5})(?:[?#]|$)/.exec(uri)?.[1];
  return extension &&
    ["jpg", "jpeg", "png", "heic", "webp"].includes(extension.toLowerCase())
    ? extension.toLowerCase()
    : "jpg";
}

function isLocalAvatar(uri: string) {
  return uri.startsWith(Paths.document.uri + localPrefix);
}

export async function copyAvatarFile(sourceUri: string) {
  const source = new File(sourceUri);
  if (!source.exists) throw new Error("无法读取所选照片，请重试");
  if (source.size > maxAvatarBytes) throw new Error("请选择 12 MB 以内的照片");
  const target = new File(
    Paths.document,
    `${localPrefix}${Date.now()}.${extensionFor(sourceUri)}`,
  );
  await source.copy(target);
  if (!target.exists || target.size === 0)
    throw new Error("头像保存失败，请重试");
  return target.uri;
}

export async function deleteAvatarFile(uri: string | null) {
  if (!uri || !isLocalAvatar(uri)) return;
  const file = new File(uri);
  if (file.exists) file.delete();
}
