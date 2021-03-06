/*****
 License
 --------------
 Copyright © 2020 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the 'License') and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 - Sridhar Voruganti <sridhar.voruganti@modusbox.com>

 --------------
 ******/
'use strict'
import { Request } from '@hapi/hapi'
import Logger from '@mojaloop/central-services-logger'
import Handler from '~/server/handlers/thirdpartyRequests/transactions'
import { Transactions } from '~/domain/thirdpartyRequests'
import TestData from 'test/unit/data/mockData.json'
import { mockResponseToolkit } from 'test/unit/__mocks__/responseToolkit'

const mockForwardTransactionRequest = jest.spyOn(Transactions, 'forwardTransactionRequest')
const mockLoggerPush = jest.spyOn(Logger, 'push')
const mockLoggerError = jest.spyOn(Logger, 'error')
const MockData = JSON.parse(JSON.stringify(TestData))

const request: Request = MockData.transactionRequest

describe('transactions handler', (): void => {
  describe('POST /thirdpartyRequests/transactions', (): void => {
    beforeAll((): void => {
      mockLoggerPush.mockReturnValue(null)
      mockLoggerError.mockReturnValue(null)
    })

    beforeEach((): void => {
      jest.clearAllMocks()
    })

    it('handles a successful request', async (): Promise<void> => {
      mockForwardTransactionRequest.mockResolvedValueOnce()

      const expected = [
        '/thirdpartyRequests/transactions',
        request.headers,
        'POST',
        {},
        request.payload,
        undefined
      ]

      // Act
      const response = await Handler.post(null, request, mockResponseToolkit)

      // Assert
      expect(response.statusCode).toBe(202)
      expect(mockForwardTransactionRequest).toHaveBeenCalledTimes(1)
      expect(mockForwardTransactionRequest).toHaveBeenCalledWith(...expected)
    })

    it('handles errors in async manner', async (): Promise<void> => {
      // Arrange
      const MockData = JSON.parse(JSON.stringify(TestData))
      const request: Request = MockData.transactionRequest
      mockForwardTransactionRequest.mockResolvedValueOnce()
      mockForwardTransactionRequest.mockRejectedValueOnce(new Error('Transactions forward Error'))
      const expected = ['/thirdpartyRequests/transactions', request.headers, 'POST', {}, request.payload, undefined]

      // Act
      const response = await Handler.post(null, request, mockResponseToolkit)

      // Assert
      expect(response.statusCode).toBe(202)
      expect(mockForwardTransactionRequest).toHaveBeenCalledTimes(1)
      expect(mockForwardTransactionRequest).toHaveBeenCalledWith(...expected)
      // Note: no promise rejection here!
    })

    it('handles validation errors synchonously', async (): Promise<void> => {
      // Arrange
      const badSpanRequest = {
        ...request,
        // Setting to empty span dict will cause a validation error
        span: {}
      }

      // Act
      const action = async () => await Handler.post(null, badSpanRequest as unknown as Request, mockResponseToolkit)

      // Assert
      await expect(action).rejects.toThrowError('span.setTags is not a function')
    })
  })
})
