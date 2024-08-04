class ProtocolParser {
    constructor(callback, syncCallback) {
        this.state = State.WAIT_FOR_SYNC;
        this.sync_byte_count = 0;
        this.address_buffer = new ArrayBuffer(2);
        this.address_uint8 = new Uint8Array(this.address_buffer);
        this.address_uint16 = new Uint16Array(this.address_buffer);
        this.count_buffer = new ArrayBuffer(2);
        this.count_uint8 = new Uint8Array(this.count_buffer);
        this.count_uint16 = new Uint16Array(this.count_buffer);
        this.data_buffer = new ArrayBuffer(2);
        this.data_uint8 = new Uint8Array(this.data_buffer);
        this.data_uint16 = new Uint16Array(this.data_buffer);

        this.callback = callback;
        this.syncCallback = syncCallback;
        this.hasCalledSync = true
    }

    processChar(c) {
        switch (this.state) {
            case State.WAIT_FOR_SYNC:
                if (!this.hasCalledSync){
                    this.syncCallback()
                    this.hasCalledSync = true
                }
                break;

            case State.ADDRESS_LOW:
                this.address_uint8[0] = c;
                this.state = State.ADDRESS_HIGH;
                break;

            case State.ADDRESS_HIGH:
                this.address_uint8[1] = c;
                if (this.address_uint16[0] !== 0x5555) {
                    this.hasCalledSync = false
                    this.state = State.COUNT_LOW;
                } else {
                    this.state = State.WAIT_FOR_SYNC;
                }
                break;

            case State.COUNT_LOW:
                this.count_uint8[0] = c;
                this.state = State.COUNT_HIGH;
                break;

            case State.COUNT_HIGH:
                this.count_uint8[1] = c;
                this.state = State.DATA_LOW;
                break;

            case State.DATA_LOW:
                this.data_uint8[0] = c;
                this.count_uint16[0]--;
                this.state = State.DATA_HIGH;
                break;

            case State.DATA_HIGH:
                this.data_uint8[1] = c;
                this.count_uint16[0]--;
                this.callback(this.address_uint16, this.data_uint16);
                this.address_uint16[0] += 2;
                if (this.count_uint16[0] === 0) {
                    this.state = State.ADDRESS_LOW;
                } else {
                    this.state = State.DATA_LOW;
                }
                break;
        }

        if (c === 0x55) this.sync_byte_count++;
        else this.sync_byte_count = 0;

        if (this.sync_byte_count === 4) {
            this.state = State.ADDRESS_LOW;
            this.sync_byte_count = 0;
        }
    }
}

const State = {
    WAIT_FOR_SYNC: 0,
    ADDRESS_LOW: 1,
    ADDRESS_HIGH: 2,
    COUNT_LOW: 3,
    COUNT_HIGH: 4,
    DATA_LOW: 5,
    DATA_HIGH: 6
};

// Usage example
const parser = new ProtocolParser((address, data) => {
    console.log('Address:', address[0]);
    console.log('Data:', data[0]);
});



module.exports = ProtocolParser;
