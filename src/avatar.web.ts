export async function copyAvatarFile(_sourceUri: string): Promise<string> {
  throw new Error("头像仅支持在手机安装版中保存");
}

export async function deleteAvatarFile(_uri: string | null) {}
