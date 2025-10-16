import { AegisSDK } from "@cavos/aegis";
import { AEGIS_CONFIG } from "../config/aegis";

const aegis = new AegisSDK(AEGIS_CONFIG);

const ADMIN_PRIVATE_KEY = process.env.EXPO_PUBLIC_ADMIN_PK || '';

const DEPORTE_MAS_POINTS = process.env.EXPO_PUBLIC_DEPORTE_MAS_POINTS || '';

export async function watchedVideo(address: string) {
    await aegis.connectAccount(ADMIN_PRIVATE_KEY);
    console.log(aegis.address);
    const tx = await aegis.execute(DEPORTE_MAS_POINTS, 'mint', [address, 100000000000000000000n, 0]);
    return tx.transactionHash;
}