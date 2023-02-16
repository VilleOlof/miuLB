async function Ping(url: string): Promise<boolean> {
    console.log(`Pinging ${url}...`);

    var response: any = await fetch(url, { method: 'HEAD' })
    .catch(function() {
        return false;
    });

    if (response.status == 404) {
        console.log("Server Is Online, Everything Is Fine :clueless:");
        return true;
    }

    console.log("Server Is Offline, Retrying...");
    return false;
}

export default Ping;