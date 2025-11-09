'''
Handles Sales Messages
'''

class Sale(object):

    def __init__(self):
        self.res_mti = '0210'
        self.response_code_map = [
            {
                'req': '00',
                'res': '00',
                'desc': 'Success/Approved'
            },
            {
                'req': '03',
                'res': '03',
                'desc': 'Invalid Merchant'
            },

            {
                'req': '12',
                'res': '12',
                'desc': 'Wrong Transaction Date/Time'
            },
            {
                'req': '14',
                'res': '14',
                'desc': 'Invalid Card'
            },
            {
                'req': '57',
                'res': '57',
                'desc': 'Refund Not Allowed'
            },
            {
                'req': '58',
                'res': '58',
                'desc': 'Invalid Transaction'
            },
            {
                'req': '94',
                'res': '94',
                'desc': 'Duplicate Transaction'
            },
            {
                'req': '95',
                'res': '9C',
                'desc': 'Not a registered Member'
            },
            {
                'req': '96',
                'res': '9D',
                'desc': 'No Merchant Program'
            },
        ]

    def get_card_number(self, req_ISO_dict):
        for DE in req_ISO_dict:
            if DE['bit'] == '2':
                return DE['value']
        return ''

    def response(self, expected_code, processing_code, req_ISO_dict):

        card_number = self.get_card_number(req_ISO_dict)

        # Validate card brand
        if card_number:
            if card_number.startswith('4'):
                print('[INFO] Visa card detected')
            elif card_number.startswith('5'):
                print('[INFO] Mastercard detected')
            elif card_number.startswith('3907'):
                print('[INFO] PIX transaction detected (BIN 3907)')
            else:
                print('[INFO] Unknown card brand')
                # For unknown, can force invalid card
                if expected_code == '00':
                    return self.res_mti, '14'  # Invalid Card

        if processing_code == '000000' or processing_code == '200000' or processing_code == '900000': # Normal Sales, Refund Sales
            # Normal Sales
            for d in self.response_code_map:
                if expected_code == d['req']:
                    return self.res_mti, d['res']

            # Return Success for any other codes
            return self.res_mti, '00'
        else:
            return self.res_mti, '99'



#------------------------------

if __name__ =='__main__':
    print('Not allowed')